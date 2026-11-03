import { RightsMark } from "./marks";

export function RightsPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-56 flex-col justify-between rounded-2xl border border-dashed border-stone-400 bg-[linear-gradient(135deg,#efe7da,#f7f3ec)] p-4">
      <RightsMark />
      <div>
        <p className="font-serif text-xl leading-snug">{label}</p>
        <p className="mt-2 text-xs leading-5 text-stone-600">
          不显示原图。官方图片地址未写入可再发布链接；请从下方来源页查看主办方页面。
        </p>
      </div>
    </div>
  );
}
