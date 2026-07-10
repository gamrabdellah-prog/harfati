export interface Specialty {
  label: string;
  icon: string;
}

export interface SpecialtyCategory {
  name: string;
  icon: string;
  specialties: Specialty[];
}

export const SPECIALTY_CATEGORIES: SpecialtyCategory[] = [
  {
    name: 'الحرف اليدوية',
    icon: '🔨',
    specialties: [
      { label: 'نجارة', icon: '🪵' },
      { label: 'حدادة', icon: '🔩' },
      { label: 'كهرباء', icon: '⚡' },
      { label: 'سباكة', icon: '🔧' },
      { label: 'دهان', icon: '🎨' },
      { label: 'ميكانيك سيارات', icon: '🚗' },
      { label: 'بناء', icon: '🧱' },
      { label: 'خياطة', icon: '🧵' },
      { label: 'لحام', icon: '🔥' },
      { label: 'بلاط وسيراميك', icon: '🏗️' },
      { label: 'زجاج', icon: '🪟' },
      { label: 'ألومنيوم', icon: '🔳' },
      { label: 'تكييف وتبريد', icon: '❄️' },
      { label: 'جبس وديكور', icon: '🏠' },
      { label: 'حدادة فنية', icon: '⚒️' },
      { label: 'نقش وزخرفة', icon: '✨' },
      { label: 'صناعة الأثاث', icon: '🛋️' },
      { label: 'إصلاح أجهزة كهرومنزلية', icon: '🔌' },
      { label: 'سمكرة', icon: '🛠️' },
      { label: 'صناعة الأحذية', icon: '👞' },
      { label: 'صناعة الجلود', icon: '👜' },
      { label: 'حياكة', icon: '🧶' },
      { label: 'طرز وتطريز', icon: '🪡' },
      { label: 'صناعة الحلي والمجوهرات', icon: '💎' },
      { label: 'صباغة', icon: '🖌️' },
      { label: 'تبليط', icon: '🔲' },
      { label: 'تكييف', icon: '🌡️' },
      { label: 'جبس', icon: '🏛️' },
      { label: 'ألمنيوم', icon: '⬜' },
      { label: 'حدائق', icon: '🌿' },
    ],
  },
  {
    name: 'التقنية والإعلام الآلي',
    icon: '💻',
    specialties: [
      { label: 'مطور ويب', icon: '🌐' },
      { label: 'مطور تطبيقات', icon: '📱' },
      { label: 'مبرمج', icon: '⌨️' },
      { label: 'مصمم جرافيك', icon: '🎨' },
      { label: 'مصمم مواقع', icon: '🖥️' },
      { label: 'تقنية معلومات', icon: '💻' },
      { label: 'شبكات', icon: '🌐' },
      { label: 'أمن معلومات', icon: '🔒' },
      { label: 'ذكاء اصطناعي', icon: '🤖' },
      { label: 'تصوير فوتوغرافي', icon: '📸' },
      { label: 'مونتاج فيديو', icon: '🎬' },
    ],
  },
  {
    name: 'الخدمات العامة',
    icon: '🛎️',
    specialties: [
      { label: 'نقل وشحن', icon: '🚚' },
      { label: 'تنظيف منازل', icon: '🧹' },
      { label: 'طباخ', icon: '👨‍🍳' },
      { label: 'حارس أمن', icon: '💂' },
      { label: 'مرافق', icon: '🚶' },
      { label: 'مساعد إداري', icon: '📋' },
      { label: 'محاسب', icon: '🧮' },
      { label: 'مترجم', icon: '🗣️' },
    ],
  },
  {
    name: 'التعليم والتدريب',
    icon: '📚',
    specialties: [
      { label: 'مدرس خصوصي', icon: '👨‍🏫' },
      { label: 'مدرب رياضي', icon: '🏋️' },
      { label: 'مدرب لغات', icon: '🗺️' },
      { label: 'مدرب موسيقى', icon: '🎵' },
    ],
  },
  {
    name: 'الزراعة والبيئة',
    icon: '🌱',
    specialties: [
      { label: 'زراعة', icon: '🌾' },
      { label: 'تنسيق حدائق', icon: '🌺' },
      { label: 'تربية حيوانات', icon: '🐄' },
      { label: 'صيد', icon: '🎣' },
    ],
  },
  {
    name: 'الصحة والجمال',
    icon: '💊',
    specialties: [
      { label: 'حلاقة', icon: '✂️' },
      { label: 'تجميل', icon: '💄' },
      { label: 'تدليك', icon: '💆' },
      { label: 'ممرض منزلي', icon: '🏥' },
    ],
  },
];

export const ALL_SPECIALTIES: Specialty[] = SPECIALTY_CATEGORIES.flatMap(
  (cat) => cat.specialties
);

export const ALL_SPECIALTY_LABELS: string[] = ALL_SPECIALTIES.map((s) => s.label);
