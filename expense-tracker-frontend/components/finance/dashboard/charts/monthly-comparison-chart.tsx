"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

interface MonthlyData {
  name: string
  income: number
  expenses: number
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[]
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={0} barCategoryGap="20%" margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="colorIncomeBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
          </linearGradient>
          <linearGradient id="colorExpensesBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: "12px",
          }}
        />
        <Legend />
        <Bar dataKey="income" name="Income" fill="url(#colorIncomeBar)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="url(#colorExpensesBar)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

