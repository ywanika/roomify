import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
      <div className="home">
        <h1 className="text-3xl text-indigo-700 font-extrabold">Home</h1>
        <Navbar />
      </div>
  );
}
