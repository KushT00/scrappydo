import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Repeat2 } from "lucide-react";

interface ScrapingScheduleProps {
    onSchedule: (schedule: {
        frequency: string;
        time: string;
        startDate: Date;
    }) => void;
}

const ScrapingSchedule: React.FC<ScrapingScheduleProps> = ({ onSchedule }) => {
    const [frequency, setFrequency] = useState('daily');
    const [time, setTime] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());

    const handleSchedule = () => {
        if (startDate && time) {
            onSchedule({
                frequency,
                time,
                startDate
            });
        }
    };

    return (
        <div className="col-span-1 backdrop-blur-md bg-card/50 p-4 w-full rounded-xl border border-border/50 shadow-lg space-y-4 flex flex-col self-start">
            <h2 className="text-lg font-semibold flex items-center">
                <Repeat2 className="mr-2 h-5 w-5" />
                Scraping Schedule
            </h2>

            <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                        <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Time of Day
                </label>
                <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-background/50 backdrop-blur-sm"
                />
            </div>

                <label className="text-sm font-medium">Start Date</label>
            <div className="space-y-2 px-6">
                <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    className="rounded-md border"
                />
            </div>

            <Button
                className="w-full bg-primary/90 hover:bg-primary/100 backdrop-blur-sm transition-all duration-300"
                onClick={handleSchedule}
            >
                Schedule Scraping
            </Button>
        </div>
    );
};

export default ScrapingSchedule;