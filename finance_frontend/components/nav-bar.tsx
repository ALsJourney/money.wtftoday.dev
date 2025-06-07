import { useLogout } from "@/hooks/useLogout";
import Link from "next/link";
export default function NavBar() {

    const { handleLogout } = useLogout();

    return (
        <nav className="navbar bg-base-100 shadow-sm">
            <div className="flex-1">
                <a className="btn btn-ghost text-xl">Finanz-Dashboard</a>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li><Link href={"/"}>Übersicht</Link></li>
                    <li>
                        <details>
                            <summary>Berechnungen</summary>
                            <ul className="bg-base-100 rounded-t-none p-2">
                                <li><Link href={"/profits"}>Einnahmen</Link></li>
                                <li><Link href={"/losses"}>Ausgaben</Link></li>
                            </ul>
                        </details>
                    </li>
                    <li>
                        <button className={"btn"} onClick={handleLogout}>
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    )
}