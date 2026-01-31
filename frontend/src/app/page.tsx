import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Reuse Vandy</h1>
          <p>
            A marketplace for Vanderbilt students to buy and sell items safely.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link href="/login" className={styles.primary}>
            Login
          </Link>
          <Link href="/signup" className={styles.secondary}>
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
