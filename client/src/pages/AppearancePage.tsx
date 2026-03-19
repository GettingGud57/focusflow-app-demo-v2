import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun } from "lucide-react";

export default function AppearancePage() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Appearance</h1>
        <p className="text-sm text-muted-foreground">Switch between light and dark. Preference is saved locally.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose your preferred look.</CardDescription>
          </div>
          <Badge variant="secondary" className="capitalize">{theme}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant={theme === "light" ? "default" : "outline"} className="gap-2" onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" /> Light
            </Button>
            <Button variant={theme === "dark" ? "default" : "outline"} className="gap-2" onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4" /> Dark
            </Button>
            <Button variant="ghost" className="ml-auto" onClick={toggleTheme}>Toggle</Button>
          </div>
          <p className="text-xs text-muted-foreground">Applies across the app. Stored in your browser.</p>
        </CardContent>
      </Card>
    </div>
  );
}
