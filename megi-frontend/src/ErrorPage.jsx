import { isRouteErrorResponse, Link, useRouteError } from "react-router";

// Prikazuje se kad ruta ne postoji ili nešto pukne pri renderovanju (umjesto bijelog ekrana)
export default function ErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>{notFound ? "Stranica ne postoji" : "Došlo je do greške"}</h1>
      {!notFound && (
        <p style={{ color: "#dc2626" }}>
          {error?.statusText || error?.message || "Nepoznata greška"}
        </p>
      )}
      <Link to="/" reloadDocument>
        Nazad na stolove
      </Link>
    </div>
  );
}
