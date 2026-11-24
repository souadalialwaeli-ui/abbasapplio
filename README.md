# abbasapplio — استوديو الصوت الذكي

<div dir="rtl">

**abbasapplio** واجهة عربية مبسّطة ومصممة للهاتف لمشروع
[Applio](https://github.com/IAHispano/Applio) مفتوح المصدر، تعمل مع دفتر
Applio الرسمي على Google Colab.

> **المبدأ الأساسي:** Applio هو محرك المعالجة، وGoogle Colab هو بيئة الحوسبة.
> هذا التطبيق يبني تجربة استخدام جميلة حول هذا العمل — لا يطوّر محرك RVC
> جديداً، ولا يخترع نتائج، ولا يتطلب وحدة GPU مدفوعة.

## ما الذي يقدمه التطبيق

- **لوحة رئيسية** تعرض حالة اتصال Colab ونماذجك ومشاريعك ومهامك.
- **استوديو تحويل الصوت:** رفع ملفات، اختيار نموذج، إعدادات Applio الحقيقية
  (النبرة، الفهرس، F0…)، وحفظ مهام حقيقية — ثم تشغيلها في واجهة Applio
  وإرفاق المخرج الفعلي.
- **تدريب النماذج:** فحص جودة التسجيلات محلياً (المدة، معدل العيّنة،
  التشويه)، ومعلمات تدريب مطابقة لـ Applio.
- **مكتبة النماذج:** استيراد/تصدير ملفات `.pth` و`.index`، محفوظة على جهازك.
- **المشاريع والسجل:** تنظيم الملفات وسجل مهام حقيقي فقط — لا سجل وهمي أبداً.
- **اتصال Colab:** دليل خطوة بخطوة لتشغيل الدفتر الرسمي وربط رابط Gradio
  العام، مع فحص اتصال صادق واستكشاف أعطال.
- **PWA قابلة للتثبيت** تعمل دون اتصال لواجهة التطبيق وبياناتك المحلية.
- **عربي RTL افتراضياً** مع خيار الإنجليزية.

## التشغيل محلياً

```bash
npm install
npm run dev        # http://localhost:5173
```

للنسخة الإنتاجية:

```bash
npm run build
npm run preview    # http://localhost:4173
```

## اختبار سير عمل Colab من الهاتف

1. افتح التطبيق على هاتفك (نفس شبكة الواي فاي مع `npm run dev -- --host`
   أو عبر نشر النسخة المبنية).
2. ثبّت التطبيق كـ PWA من متصفح Chrome (قائمة ← «إضافة إلى الشاشة الرئيسية»).
3. من صفحة **اتصال Colab** افتح دفتر Applio الرسمي في المتصفح.
4. شغّل خلايا: Mount Drive ← Setup ← Start server (Gradio).
5. انسخ رابط `*.gradio.live` والصقه في التطبيق واضغط «ربط الجلسة».
6. افتح Applio من التطبيق وحوّل صوتاً أو درّب نموذجاً هناك.
7. ارجع للتطبيق وأرفق الملف الناتج بالمهمة لعرضه وتشغيله وتنزيله.

## الحدود بصراحة

- موارد Colab المجانية محدودة ويتحكم بها Google؛ قد لا تتوفر GPU وقد تنقطع
  الجلسة (غالباً خلال 12 ساعة).
- التطبيق لا يتحكم بـ Colab ولا يؤتمت تسجيل الدخول — كل التفاعل يتم في
  متصفحك داخل Colab نفسه.
- واجهة Applio تُفتح في المتصفح الخارجي؛ روابط Gradio مؤقتة ولا يمكن تضمينها
  بشكل موثوق داخل التطبيق.
- لا يوجد خادم خاص بالتطبيق: كل بياناتك على جهازك وفي Drive الخاص بك.

## الأمان والاستخدام المسؤول

- استخدم فقط أصواتاً تملكها أو لديك إذن صريح باستخدامها.
- لا تسجيل دخول داخل التطبيق، ولا كلمات مرور، ولا رموز جلسات محفوظة.
- رابط جلسة Colab يُحفظ على جهازك فقط ولا يُرسل لأي خادم.

## التوثيق

- `docs/FEASIBILITY.md` — دراسة الجدوى التقنية (ما يمكن وما لا يمكن دمجه)
- `docs/ARCHITECTURE.md` — بنية المشروع والقرارات التصميمية
- `docs/COLAB_INTEGRATION.md` — تفاصيل تكامل Colab
- `docs/DEVELOPMENT.md` — دليل التطوير والاختبار

## التقنية

React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS v4 · React Router ·
IndexedDB (idb-keyval) · vite-plugin-pwa · Lucide icons.

</div>

---

## abbasapplio — AI Voice Studio (English summary)

A mobile-first Arabic RTL interface around the open-source
[Applio](https://github.com/IAHispano/Applio) project, running on the
official Applio notebook in Google Colab. Applio remains the processing
engine; Colab remains the compute. This app provides the studio experience:
conversion jobs, training sessions, a local model library, projects and
history — all stored on-device — plus a guided Colab handoff with honest
session status. No fake processing, no paid GPU, no automated Google login.

```bash
npm install
npm run dev
```

See `docs/` for feasibility, architecture, Colab integration and
development notes.
