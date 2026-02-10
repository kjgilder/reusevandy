from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query


from app.api import deps
from app.models.user import User
from app.models.listing import Listing, Category, ListingStatus
from app.schemas.listing import ListingCreate, ListingOut, ListingUpdate

router = APIRouter()

@router.post("/", response_model=ListingOut)
async def create_listing(
    listing_in: ListingCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new listing.
    """
    listing = Listing(
        **listing_in.dict(),
        seller=current_user
    )
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
    sort_by: Optional[str] = Query("newest", enum=["newest", "oldest", "price_asc", "price_desc"]),
) -> Any:
    """
    Retrieve listings with filters.
    """
    query = Listing.find(Listing.status == ListingStatus.AVAILABLE)
    
    if search:
        # Simple regex or text search if indexed (using regex for simplicity now)
        query = query.find({"title": {"$regex": search, "$options": "i"}})
    
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
