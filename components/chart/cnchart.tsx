"use client"

import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import { z } from "zod";
import { format } from "date-fns";

const chartSchema = z.object({
  date: z.string(),
  price: z.number(),
});

type ChartData = z.infer<typeof chartSchema>;

const chartConfig = {
  MyProtein: {
    label: "Myprotein",
    color: "hsl(var(--chart-1))",
  },
 
} satisfies ChartConfig;

function calculateMinPriceDate(data: ChartData[]) {
  return data.reduce((prev, current) =>
    prev.price < current.price ? prev : current
  );
}

export function PriceChart({ data }: { data: ChartData[] }) {
  
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="h-96">
        <ChartContainer config={chartConfig} className="h-full w-full" >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}

            
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={false}
              formatter={(value, name, props) => [value, 'price']}
              labelFormatter={(label) => format(new Date(label), 'PPpp')}
            />
            <Area
              dataKey="price" // y axis key for data object
              type="natural"
              fill="var(--color-MyProtein)"
              fillOpacity={0.4}
              stroke="var(--color-MyProtein)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Minimum Price {calculateMinPriceDate(data).price}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Best date to buy {format(new Date(calculateMinPriceDate(data).date), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}