import { Adventure } from "@/types";

export const adventures: Adventure[] = [
    {
        id: "m1",
        title: "Trip planner",
        description: "plan your trip",
        missions: [
            { id: "f1", title: "check flight information", difficulty: "medium", completed: false },
            { id: "e1", title: "check lodging information", difficulty: "medium", completed: false },
        ]
    },

     {
        id: "h1",
        title: "health companion",
        description: "improve your health",
        missions: [
            { id: "c1", title: "calorie count helper", difficulty: "high", completed: false },
            { id: "g1", title: "gym asistant", difficulty: "high", completed: false },
        ]
    },

];
