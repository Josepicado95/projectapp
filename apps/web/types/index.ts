export type Mission = {
    id: string;
    title: string;
    difficulty: "low"  | "medium" | "high";
    completed: boolean;
 
};

export type Adventure = {
    id: string;
    title: string;
    description: string;
    missions: Mission[]

};