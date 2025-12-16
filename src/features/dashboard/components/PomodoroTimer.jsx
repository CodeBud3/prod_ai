import React, { useState, useRef, useEffect, useCallback } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import {
    Widget,
    WidgetContent,
    WidgetFooter,
    WidgetHeader,
} from "@/components/ui/widget";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PomodoroTimer() {
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [timeLeft, setTimeLeft] = useState(1800);
    const intervalRef = useRef(null);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = (timeLeft % 60).toString().padStart(2, "0");

    const resetTimer = useCallback(() => {
        setIsCountingDown(false);
        setTimeLeft(1800);
    }, []);

    const handleToggle = useCallback(() => {
        setIsCountingDown((prev) => !prev);
    }, []);

    useEffect(() => {
        if (isCountingDown && !intervalRef.current) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }

        if (!isCountingDown) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isCountingDown]);

    return (
        <Widget design="mumbai" style={{ width: '100%', marginBottom: '20px' }}>
            <WidgetHeader className="justify-center">
                <Label className="text-muted-foreground text-3xl">🚀</Label>
            </WidgetHeader>
            <WidgetContent>
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                    <Label className="text-4xl">
                        {minutes}:{seconds}
                    </Label>
                    <Label className="text-muted-foreground text-xs">POMODORO</Label>
                </div>
            </WidgetContent>
            <WidgetFooter>
                <Button
                    aria-label="Reset timer"
                    onClick={resetTimer}
                    variant="outline"
                    size="icon-sm"
                    className="rounded-full h-8 w-8"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                    aria-label={isCountingDown ? "Pause timer" : "Start timer"}
                    onClick={handleToggle}
                    variant="outline"
                    size="icon-sm"
                    className="rounded-full h-8 w-8"
                >
                    {isCountingDown ? (
                        <Pause className="size-4 fill-current stroke-none" />
                    ) : (
                        <Play className="size-4 fill-current stroke-none" />
                    )}
                </Button>
            </WidgetFooter>
        </Widget>
    );
}
