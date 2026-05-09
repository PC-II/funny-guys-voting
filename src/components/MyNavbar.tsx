import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useNavigate } from "react-router-dom";
import { useCountdown } from "../hooks/useCountDown";

export function MyNavbar() {
  const navigate = useNavigate();
  const { activeYear } = useCountdown();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/SignIn");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full px-4 pt-4">
      <Navbar
        fluid
        className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-white/5 py-3 shadow-2xl backdrop-blur-lg"
      >
        <NavbarBrand href="#/home">
          <div className="flex items-center gap-2">
            {/* Simple Logo Circle */}
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20" />
            <span className="self-center text-xl font-bold tracking-tight whitespace-nowrap text-white">
              {activeYear} Funny <span className="text-blue-400">Guys</span>
            </span>
          </div>
        </NavbarBrand>

        <div className="flex md:order-2">
          {/* Sign Out Action */}
          <button
            onClick={handleSignOut}
            className="hidden cursor-pointer rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white md:block"
          >
            Sign Out
          </button>
          <NavbarToggle className="bg-white/5 hover:bg-white/10" />
        </div>

        <NavbarCollapse>
          <NavbarLink
            href="#/home"
            className="text-xl text-slate-300 hover:text-white active:text-blue-400 md:bg-transparent md:p-0"
          >
            Home
          </NavbarLink>
          <NavbarLink
            href="#/voting"
            className="text-xl text-slate-300 hover:text-white active:text-blue-400 md:bg-transparent md:p-0"
          >
            Voting
          </NavbarLink>
          <NavbarLink
            href="#/vault"
            className="text-xl text-slate-300 hover:text-white active:text-blue-400 md:bg-transparent md:p-0"
          >
            The Vault
          </NavbarLink>
          <NavbarLink
            href="#/halloffame"
            className="text-xl text-slate-300 hover:text-white active:text-blue-400 md:bg-transparent md:p-0"
          >
            Hall Of Fame
          </NavbarLink>
          <NavbarLink
            href="#/discordhost"
            className="text-xl text-slate-300 hover:text-white active:text-blue-400 md:bg-transparent md:p-0"
          >
            Discord Host
          </NavbarLink>

          {/* Mobile-only Sign Out */}
          <button
            onClick={handleSignOut}
            className="mt-4 block w-full rounded-lg bg-red-500 py-2 text-center text-sm font-bold text-white md:hidden"
          >
            Sign Out
          </button>
        </NavbarCollapse>
      </Navbar>
    </div>
  );
}
