import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FastForward, Hand } from "lucide-react";
import { useData } from "@/components/data/context/DataContext";

export default function TimerPage() {
  const { autoAdvance, setAutoAdvance } = useData();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Timer</h1>
        <p className="text-sm text-muted-foreground">
          What happens when a step's time runs out. Saved locally.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Flow mode</CardTitle>
            <CardDescription>Move to the next step without being asked.</CardDescription>
          </div>
          <Badge variant="secondary">{autoAdvance ? "On" : "Off"}</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            {autoAdvance
              ? <FastForward className="h-5 w-5 text-muted-foreground" />
              : <Hand className="h-5 w-5 text-muted-foreground" />}
            <Label htmlFor="auto-advance" className="flex-1">
              Start the next step automatically
            </Label>
            <Switch
              id="auto-advance"
              checked={autoAdvance}
              onCheckedChange={setAutoAdvance}
            />
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Off.</span> At zero the timer
              keeps counting <em>up</em> and waits. You press Done when you're actually
              finished, so a step can run long without the app deciding for you.
            </p>
            <p>
              <span className="font-medium text-foreground">On.</span> At zero the next step
              starts itself and a cue tells you it happened. Built for hands-busy, eyes-free
              work — gym sets and rest, stretching — where the sound is the interface and
              checking your phone defeats the point.
            </p>
            <p>
              The two are mutually exclusive: with flow mode on there is no overtime, because
              nothing ever waits.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Before you rely on it</CardTitle>
          <CardDescription>Two honest limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Stay on the Dashboard.</span> The
            hand-off is driven by the timer view, so navigating to another page stops the chain
            advancing. Turning the screen off is fine — that doesn't close the page.
          </p>
          <p>
            <span className="font-medium text-foreground">One cue for every transition.</span>
            {" "}Steps are just tasks, so the app can't tell a lift from a rest. Distinguishing
            "start lifting" from "start resting" needs that difference in the data model first.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
