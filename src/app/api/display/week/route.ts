const sampleWeek = {
  schemaVersion: 1,
  timezone: "America/New_York",
  profile: {
    displayName: "Morgan",
    theme: "neon-graveyard",
    clockStyle: "digital-neon",
  },
  weather: {
    temperature: 68,
    condition: "cloudy",
    high: 72,
    low: 61,
    sass: "The sun left the group chat.",
  },
  days: [
    {
      date: "2026-08-17",
      tasks: [
        { id: "sample-1", title: "Pack science project", time: "08:10", kind: "school", completed: false },
        { id: "sample-2", title: "Feed Pixel", time: "16:00", kind: "home", completed: false },
      ],
    },
    { date: "2026-08-18", tasks: [] },
    { date: "2026-08-19", tasks: [] },
    { date: "2026-08-20", tasks: [] },
    { date: "2026-08-21", tasks: [] },
    { date: "2026-08-22", tasks: [] },
    { date: "2026-08-23", tasks: [] },
  ],
};

export async function GET() {
  return Response.json({ ...sampleWeek, generatedAt: new Date().toISOString() }, {
    headers: {
      "Cache-Control": "private, max-age=60",
    },
  });
}
