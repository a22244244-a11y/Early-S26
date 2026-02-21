"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MODELS, COLORS_BY_MODEL, type Model } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

const singleFormSchema = z.object({
  model: z.enum(["S26", "S26+", "Ultra"]),
  color: z.string().min(1, "색상을 선택하세요"),
  serialNumber: z.string().min(1, "일련번호를 입력하세요"),
  arrivalDate: z.string().min(1, "입고일을 입력하세요"),
});

const bulkFormSchema = z.object({
  model: z.enum(["S26", "S26+", "Ultra"]),
  color: z.string().min(1, "색상을 선택하세요"),
  serialNumbers: z.string().min(1, "일련번호를 입력하세요"),
  arrivalDate: z.string().min(1, "입고일을 입력하세요"),
});

export function InventoryForm() {
  const { groupId } = useAuth();
  const createInventory = useMutation(api.inventory.create);
  const createBulk = useMutation(api.inventory.createBulk);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const singleForm = useForm<z.infer<typeof singleFormSchema>>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      model: undefined,
      color: "",
      serialNumber: "",
      arrivalDate: new Date().toISOString().split("T")[0],
    },
  });

  const bulkForm = useForm<z.infer<typeof bulkFormSchema>>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      model: undefined,
      color: "",
      serialNumbers: "",
      arrivalDate: new Date().toISOString().split("T")[0],
    },
  });

  const singleModel = singleForm.watch("model") as Model | undefined;
  const bulkModel = bulkForm.watch("model") as Model | undefined;

  async function onSingleSubmit(values: z.infer<typeof singleFormSchema>) {
    if (!groupId) {
      toast.error("그룹 정보가 없습니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createInventory({
        groupId: groupId as Id<"groups">,
        model: values.model,
        color: values.color as any,
        serialNumber: values.serialNumber,
        arrivalDate: values.arrivalDate,
      });
      toast.success("재고가 등록되었습니다.");
      singleForm.reset({
        model: values.model,
        color: values.color,
        serialNumber: "",
        arrivalDate: values.arrivalDate,
      });
    } catch (error: any) {
      toast.error(error.message || "등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onBulkSubmit(values: z.infer<typeof bulkFormSchema>) {
    if (!groupId) {
      toast.error("그룹 정보가 없습니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      const serials = values.serialNumbers
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (serials.length === 0) {
        toast.error("일련번호를 입력하세요.");
        return;
      }

      await createBulk({
        groupId: groupId as Id<"groups">,
        items: serials.map((serialNumber) => ({
          model: values.model,
          color: values.color as any,
          serialNumber,
          arrivalDate: values.arrivalDate,
        })),
      });
      toast.success(`${serials.length}건의 재고가 등록되었습니다.`);
      bulkForm.reset({
        model: values.model,
        color: values.color,
        serialNumbers: "",
        arrivalDate: values.arrivalDate,
      });
    } catch (error: any) {
      toast.error(error.message || "등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderModelColorFields(
    form: any,
    selectedModel: Model | undefined,
  ) {
    const colors = selectedModel ? COLORS_BY_MODEL[selectedModel] : [];
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="model"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>모델</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("color", "");
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="모델 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
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
          name="color"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>색상</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedModel}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedModel ? "색상 선택" : "모델을 먼저 선택"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
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
          name="arrivalDate"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>입고일</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>재고 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList className="mb-4">
            <TabsTrigger value="single">단건 등록</TabsTrigger>
            <TabsTrigger value="bulk">대량 등록</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Form {...singleForm}>
              <form
                onSubmit={singleForm.handleSubmit(onSingleSubmit)}
                className="space-y-4"
              >
                {renderModelColorFields(singleForm, singleModel)}
                <FormField
                  control={singleForm.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>일련번호</FormLabel>
                      <FormControl>
                        <Input placeholder="일련번호 입력" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "등록 중..." : "재고 등록"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="bulk">
            <Form {...bulkForm}>
              <form
                onSubmit={bulkForm.handleSubmit(onBulkSubmit)}
                className="space-y-4"
              >
                {renderModelColorFields(bulkForm, bulkModel)}
                <FormField
                  control={bulkForm.control}
                  name="serialNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>일련번호 (줄바꿈으로 구분)</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder={"일련번호1\n일련번호2\n일련번호3"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "등록 중..." : "대량 등록"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
