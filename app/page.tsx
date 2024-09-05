import { Metadata } from "next"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { LineChartHero } from "@/components/chart/chart"
import { getCurrentDiscount } from "@/backend/database"
import { QueryClientProvider1 } from "@/components/chart/wrapper"

export const runtime = "edge";


export const metadata: Metadata = {
  title: "Dashboard",
  description: "Example dashboard app built using the components.",
}

export default async function DashboardPage() {
  const currentDiscount = await getCurrentDiscount() || 50;
  const nonExistent = currentDiscount === null;
  const isReasonable = nonExistent ? false : currentDiscount >= 80;


  return (
    <>
      <div className="hidden flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="To Be Built">
                In progress
              </TabsTrigger>
      
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Current Discount
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentDiscount}%</div>
                    {isReasonable 
                    ? (
                    <p className="text-xs text-muted-foreground">
                      The discount is rather reasonable!!
                    </p>)
                    : (
                    <p className="text-xs text-muted-foreground">
                      You can wait for the discount to increase...
                    </p>
                    )
                    }
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Whey Protein Prices (per gram)
                    </CardTitle>
                  
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold"> $Placeholder </div>
                    <p className="text-xs text-muted-foreground">
                      % placeholder
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+12,234</div>
                    <p className="text-xs text-muted-foreground">
                      +19% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Server status
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">
                      +201 since last hour
                    </p>
                  </CardContent>
                </Card>
              </div>
              <QueryClientProvider1>
                <LineChartHero />

              </QueryClientProvider1>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}