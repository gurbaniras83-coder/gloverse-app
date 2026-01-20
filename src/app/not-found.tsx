export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-semibold">Page Not Found</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <a 
          href="/" 
          className="mt-6 inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}