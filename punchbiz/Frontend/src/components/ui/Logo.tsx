import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    variant?: "icon" | "full";
}

export const Logo = ({ className, variant = "icon" }: LogoProps) => (
    <div className={cn("flex items-center gap-3", className)}>
        <div className="relative flex items-center justify-center">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 4C10.5 4 9.5 5 9 6C8.5 5 7.5 4 6 4C4 4 2.5 5.5 2.5 7.5C2.5 9 3.5 10 4 10.5C3 11 2 12.5 2 14.5C2 17.5 4.5 20 8 20H16C19.5 20 22 17.5 22 14.5C22 12.5 21 11 20 10.5C20.5 10 21.5 9 21.5 7.5C21.5 5.5 20 4 18 4C16.5 4 15.5 5 15 6C14.5 5 13.5 4 12 4Z"
                    fill="hsl(var(--primary))"
                />
                <circle cx="8.5" cy="12" r="1.5" fill="hsl(var(--background))" />
                <circle cx="15.5" cy="12" r="1.5" fill="hsl(var(--background))" />
                <ellipse cx="12" cy="16" rx="2.5" ry="1.5" fill="hsl(var(--background))" opacity="0.6" />
            </svg>
        </div>
    </div>
);
