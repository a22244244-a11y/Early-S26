"use client";

import { useMutation, useQuery } from "convex/react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import {
  MODELS,
  COLORS_BY_MODEL,
  SUBSCRIPTION_TYPES,
  ACTIVATION_TIMINGS,
  type Model,
} from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { useGroupStores } from "@/lib/useStores";
import { Id } from "../../../convex/_generated/dataModel";

const formSchema = z.object({
  storeName: z.string().min(1, "매장을 선택하세요"),
  recruiter: z.string().min(1, "유치자를 입력하세요"),
  subscriptionType: z.enum(["010신규", "MNP", "기변"]),
  customerName: z.string().min(1, "고객명을 입력하세요"),
  productNumber: z.string().min(1, "상품번호를 입력하세요"),
  model: z.enum(["S26", "S26+", "S26Ultra"]),
  color: z.string().min(1, "색상을 선택하세요"),
  activationTiming: z.string().min(1, "개통시점을 선택하세요"),
  preOrderNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ReservationForm() {
  const { groupId } = useAuth();
  const stores = useGroupStores();
  const createReservation = useMutation(api.reservations.create);
  const groupLinks = useQuery(
    api.groupLinks.get,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{
    subscriptionType: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: undefined,
      recruiter: "",
      subscriptionType: "010신규",
      customerName: "",
      productNumber: "",
      model: undefined,
      color: "",
      activationTiming: "",
      preOrderNumber: "",
    },
  });

  const selectedModel = form.watch("model") as Model | undefined;
  const availableColors = selectedModel
    ? COLORS_BY_MODEL[selectedModel]
    : [];

  async function onSubmit(values: FormValues) {
    if (!groupId) {
      toast.error("그룹 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createReservation({
        groupId: groupId as Id<"groups">,
        storeName: values.storeName,
        recruiter: values.recruiter,
        subscriptionType: values.subscriptionType,
        customerName: values.customerName,
        productNumber: values.productNumber,
        model: values.model,
        color: values.color as any,
        activationTiming: values.activationTiming,
        preOrderNumber: values.preOrderNumber || undefined,
      });
      toast.success("예약이 등록되었습니다.");
      setSuccessDialog({ subscriptionType: values.subscriptionType });
      form.reset();
    } catch (error) {
      toast.error("예약 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getOnsaleUrl(subscriptionType: string) {
    if (!groupLinks) return null;
    switch (subscriptionType) {
      case "010신규":
        return groupLinks.onsaleNewUrl || null;
      case "기변":
        return groupLinks.onsaleDeviceChangeUrl || null;
      case "MNP":
        return groupLinks.onsaleMNPUrl || null;
      default:
        return null;
    }
  }

  const preOrderUrl = groupLinks?.preOrderUrl || "https://pre-salemobile.uplus.co.kr";

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>예약 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>매장</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="매장 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store._id} value={store.name}>
                            {store.name}
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
                name="recruiter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>유치자</FormLabel>
                    <FormControl>
                      <Input placeholder="유치자명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고객명</FormLabel>
                    <FormControl>
                      <Input placeholder="고객명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상품번호</FormLabel>
                    <FormControl>
                      <Input placeholder="상품번호" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>단말기 모델</FormLabel>
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
                render={({ field }) => (
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
                              selectedModel
                                ? "색상 선택"
                                : "모델을 먼저 선택하세요"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableColors.map((color) => (
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
                name="preOrderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사전예약번호 (선택)</FormLabel>
                    <FormControl>
                      <Input placeholder="사전예약번호" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activationTiming"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>개통시점</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="개통시점 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVATION_TIMINGS.map((timing) => (
                          <SelectItem key={timing} value={timing}>
                            {timing}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subscriptionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>가입구분</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row gap-4"
                    >
                      {SUBSCRIPTION_TYPES.map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <RadioGroupItem value={type} id={type} />
                          <Label htmlFor={type} className="cursor-pointer">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "예약 등록"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Dialog
      open={!!successDialog}
      onOpenChange={(open) => {
        if (!open) setSuccessDialog(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>예약 등록 완료</DialogTitle>
          <DialogDescription>
            예약이 성공적으로 등록되었습니다. 다음 단계를 진행하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          {successDialog && getOnsaleUrl(successDialog.subscriptionType) && (
            <a
              href={getOnsaleUrl(successDialog.subscriptionType)!}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full" size="lg">
                온세일 작성
              </Button>
            </a>
          )}
          <a
            href={preOrderUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full" size="lg">
              공식홈페이지 등록
            </Button>
          </a>
          <Button
            variant="ghost"
            onClick={() => setSuccessDialog(null)}
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
