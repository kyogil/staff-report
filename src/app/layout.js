import "./globals.css";

export const metadata = {
  title: "Daily Task Manager",
  description: "A full-stack application to manage daily tasks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}