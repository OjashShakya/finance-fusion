"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Income } from "@/types/finance"
import { IncomeCategory } from "@/types/finance"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const incomeFormSchema = z.object({
  description: z.string().min(1, "Description is required").max(100, "Description must be less than 100 characters"),
  amount: z.string().min(1, "Amount is required"),
  category: z.nativeEnum(IncomeCategory),
  date: z.date(),
})

export function IncomeForm({ onSubmit }: { onSubmit: (data: Omit<Income, "id">) => Promise<void> }) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof incomeFormSchema>>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: IncomeCategory.SALARY,
      date: new Date(),
    },
  })

  async function handleSubmit(data: z.infer<typeof incomeFormSchema>) {
    try {
      // Convert amount to number
      const amount = parseFloat(data.amount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        })
        return
      }

      // Create income object
      const income: Omit<Income, "id"> = {
        description: data.description,
        amount: amount,
        category: data.category,
        date: data.date,
      }

      await onSubmit(income)
      
      toast({
        title: "Income added",
        description: `Rs. ${amount.toFixed(2)} from ${data.category}`,
        variant: "success",
        duration: 3000,
      })
      
      // Reset form
      form.reset({
        description: "",
        amount: "",
        category: IncomeCategory.SALARY,
        date: new Date(),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add income. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="bg-white dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e]">
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1c1c1c]">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="dark:bg-[#1c1c1c]">
                      {Object.values(IncomeCategory).map((category) => (
                        <SelectItem 
                          key={category} 
                          value={category}
                          className="dark:focus:bg-gray-800"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Source</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Add a description" 
                      {...field} 
                      maxLength={100}
                      className="h-12 rounded-xl border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1c1c1c]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      min="0.01"
                      step="0.01"
                      {...field} 
                      className="h-12 rounded-xl border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1c1c1c]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-12 w-full rounded-xl border-gray-200 bg-white pl-3 text-left font-normal dark:border-gray-800 dark:bg-[#1c1c1c]",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        fromYear={2020}
                        toYear={2030}
                        captionLayout="dropdown"
                        className="rounded-md border shadow"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-[#27ae60] hover:bg-[#2ecc71] dark:bg-[#27ae60] dark:hover:bg-[#2ecc71]"
            >
              Add Income
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

