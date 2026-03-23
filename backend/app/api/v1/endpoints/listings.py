from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
import httpx

from app.api import deps
from app.core.config import get_settings
from app.models.user import User
from app.models.listing import Listing, Category, ListingStatus
from app.schemas.listing import ListingCreate, ListingOut, ListingUpdate

router = APIRouter()
settings = get_settings()


@router.post("/", response_model=ListingOut)
async def create_listing(
    listing_in: ListingCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new listing.
    """
    listing = Listing(**listing_in.dict(), seller=current_user)
    await listing.insert()
    # Fetch again to populate links if needed, though simpler just to return constructed
    # But for UserOut nested model, we might need manual construction or fetch
    return listing


@router.get("/", response_model=List[ListingOut])
async def read_listings(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[Category] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = Query(
        "newest", enum=["newest", "oldest", "price_asc", "price_desc"]
    ),
) -> Any:
    """
    Retrieve listings with filters.
    """
    query = Listing.find(Listing.status == ListingStatus.ACTIVE)

    if search:
        # Simple regex or text search if indexed (using regex for simplicity now)
        # Search in title OR description
        query = query.find(
            {
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                ]
            }
        )

    if category:
        query = query.find(Listing.category == category)

    if min_price is not None:
        query = query.find(Listing.price >= min_price)

    if max_price is not None:
        query = query.find(Listing.price <= max_price)

    # Sorting
    if sort_by == "newest":
        query = query.sort("-created_at")
    elif sort_by == "oldest":
        query = query.sort("created_at")
    elif sort_by == "price_asc":
        query = query.sort("price")
    elif sort_by == "price_desc":
        query = query.sort("-price")

    listings = await query.skip(skip).limit(limit).to_list()

    # We need to fetch related seller data for response model
    for listing in listings:
        await listing.fetch_link(Listing.seller)

    return listings


@router.get("/me", response_model=List[ListingOut])
async def read_my_listings(
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve listings created by the current user.
    """
    query = Listing.find(Listing.seller.id == current_user.id)
    query = query.sort("-created_at")

    listings = await query.skip(skip).limit(limit).to_list()

    for listing in listings:
        await listing.fetch_link(Listing.seller)

    return listings


@router.get("/purchased", response_model=List[ListingOut])
async def read_purchased_listings(
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve listings purchased by the current user.
    """
    # Find listings where buyer.id == current_user.id
    query = Listing.find(Listing.buyer.id == current_user.id)
    query = query.sort("-updated_at")

    listings = await query.skip(skip).limit(limit).to_list()

    for listing in listings:
        await listing.fetch_link(Listing.seller)

    return listings


@router.get("/{id}", response_model=ListingOut)
async def read_listing(id: UUID) -> Any:
    """
    Get a specific listing by ID.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)
    return listing


@router.put("/{id}", response_model=ListingOut)
async def update_listing(
    id: UUID,
    listing_in: ListingUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a listing. Only the seller can update it.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)
    if listing.seller.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = listing_in.dict(exclude_unset=True)
    await listing.set(update_data)

    return listing


@router.delete("/{id}")
async def delete_listing(
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a listing. Only the seller can delete it.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)
    if listing.seller.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await listing.delete()
    return {"message": "Listing deleted successfully"}


@router.post("/{id}/images", response_model=ListingOut)
async def upload_listing_image(
    id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload an image for a listing. Stores it in Vercel Blob and saves the URL.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)
    if listing.seller.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed (jpeg, png, webp, gif)",
        )

    file_data = await file.read()
    filename = f"listings/{id}/{file.filename}"

    # Upload to Vercel Blob via REST API
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"https://blob.vercel-storage.com/{filename}",
            content=file_data,
            headers={
                "authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                "x-api-version": "7",
                "content-type": file.content_type or "application/octet-stream",
                "x-content-type": file.content_type or "application/octet-stream",
                "access": "public",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image to Vercel Blob: {response.text}",
        )

    blob_url = response.json()["url"]

    # Save URL to listing
    listing.images.append(blob_url)
    await listing.set({"images": listing.images})

    return listing


@router.delete("/{id}/images")
async def delete_listing_image(
    id: UUID,
    image_url: str = Query(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Remove a specific image URL from a listing.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)
    if listing.seller.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if image_url in listing.images:
        listing.images.remove(image_url)
        await listing.set({"images": listing.images})
    else:
        raise HTTPException(status_code=404, detail="Image URL not found in listing")


@router.post("/{id}/confirm-sold")
async def confirm_sold(
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Confirm that the item has been sold.
    Seller confirms first → status stays PENDING, seller_confirmed_sold = True.
    Buyer then confirms → both flags True → status becomes SOLD.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)

    # Safely fetch buyer only if it exists
    buyer_id = None
    if listing.buyer:
        try:
            await listing.fetch_link(Listing.buyer)
            buyer_id = listing.buyer.id if listing.buyer else None
        except Exception:
            buyer_id = None

    if current_user.id == listing.seller.id:
        listing.seller_confirmed_sold = True
    elif buyer_id and current_user.id == buyer_id:
        listing.buyer_confirmed_sold = True
    else:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this transaction")

    # Only mark as SOLD when both parties have confirmed
    if listing.seller_confirmed_sold and listing.buyer_confirmed_sold:
        listing.status = ListingStatus.SOLD

    await listing.save()
    return listing


@router.post("/{id}/revert-active")
async def revert_active(
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Move a listing from Pending or Cancelled back to Active.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)
    if listing.seller.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    listing.status = ListingStatus.ACTIVE
    listing.seller_confirmed_sold = False
    listing.buyer_confirmed_sold = False
    # Optionally clear the buyer? Let's keep it for now if they want to try again
    await listing.save()
    return listing


@router.post("/{id}/cancel")
async def cancel_listing(
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Cancel a listing or a pending transaction and put it back on market.
    """
    listing = await Listing.get(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await listing.fetch_link(Listing.seller)
    if listing.seller.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    listing.status = ListingStatus.ACTIVE
    listing.seller_confirmed_sold = False
    listing.buyer_confirmed_sold = False
    await listing.save()
    return listing
