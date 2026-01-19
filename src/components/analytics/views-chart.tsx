
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatViews } from "@/lib/utils";

// Generate dummy data for the last 28 days
const generateDummyData = () => {
    const data = [];
    let totalViews = 0;
    for (let i = 27; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dailyViews = Math.floor(Math.random() * (5000 - 500 + 1) + 500);
        totalViews += dailyViews;
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: dailyViews,
        });
    }
    return { data, totalViews };
};

const chartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--primary))",
  },
};

export function ViewsChart() {
    const { data, totalViews } = generateDummyData();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Views (Sample Data)</CardTitle>
                <CardDescription>
                    Your channel got {formatViews(totalViews)} views in the last 28 days. Below is a sample chart.
                    A backend is required to store and aggregate daily data for this chart to show your channel's actual performance.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatViews(Number(value))} />
                         <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Line dataKey="views" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
