import type { Language } from "./types.js";

export type MessageKey =
  | "appName"
  | "tagline"
  | "settings"
  | "friends"
  | "addFriend"
  | "friendPlaceholder"
  | "mode"
  | "modeStrict"
  | "modeStrictHint"
  | "modeFollowing"
  | "modeFollowingHint"
  | "sessionLimit"
  | "dailyBudget"
  | "dailyBudgetOff"
  | "theme"
  | "themeLight"
  | "themeDark"
  | "themeSystem"
  | "language"
  | "enabled"
  | "save"
  | "saved"
  | "minutes"
  | "sessionEndTitle"
  | "sessionEndBody"
  | "overrideLimit"
  | "startNewSession"
  | "timeRemaining"
  | "blockedTitle"
  | "blockedBody"
  | "goHome"
  | "openMessages"
  | "unsupportedAuthors"
  | "emptyAllowlist"
  | "followingUnavailable"
  | "storyFilterPartial"
  | "storyViewerUnsafe"
  | "privacyNote"
  | "limitations"
  | "close"
  | "remove"
  | "noFriendsYet"
  | "capabilities"
  | "adDisclaimer";

const EN: Record<MessageKey, string> = {
  appName: "OnlyFriends",
  tagline: "Instagram, just your people.",
  settings: "Settings",
  friends: "Selected friends",
  addFriend: "Add",
  friendPlaceholder: "username",
  mode: "Feed mode",
  modeStrict: "Strict Friends",
  modeStrictHint:
    "Show only posts whose author matches your allowlist. If an author cannot be identified, the post is hidden.",
  modeFollowing: "Following (Instagram)",
  modeFollowingHint:
    "Try Instagram’s built-in Following feed when available. This is separate from your Strict Friends list.",
  sessionLimit: "Session length",
  dailyBudget: "Daily budget",
  dailyBudgetOff: "Off",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  language: "Language",
  enabled: "OnlyFriends active",
  save: "Save",
  saved: "Saved",
  minutes: "min",
  sessionEndTitle: "You're caught up.",
  sessionEndBody: "Go enjoy your day.",
  overrideLimit: "Continue a little longer",
  startNewSession: "Start a fresh session",
  timeRemaining: "Time left",
  blockedTitle: "That area is paused",
  blockedBody:
    "Explore and Reels are hidden in OnlyFriends so you can stay with people you chose.",
  goHome: "Back to feed",
  openMessages: "Messages",
  unsupportedAuthors:
    "Some posts could not be matched to usernames and were hidden (fail-closed).",
  emptyAllowlist: "Add at least one friend to use Strict Friends mode.",
  followingUnavailable:
    "Instagram’s Following feed was not detected. Staying on home; Strict Friends filtering still applies if enabled.",
  storyFilterPartial:
    "Story tray filtering is partial — some rings may lack readable usernames.",
  storyViewerUnsafe:
    "Story viewer swipe navigation cannot be filtered reliably. Open stories only from filtered tray entries.",
  privacyNote:
    "Preferences stay on this device. OnlyFriends never sees your Instagram password, DMs, or media.",
  limitations:
    "Works by reshaping the Instagram website you already signed into. Layout changes on Instagram’s side can reduce filtering accuracy.",
  close: "Close",
  remove: "Remove",
  noFriendsYet: "No friends yet — add usernames you want to see.",
  capabilities: "Capability status",
  adDisclaimer: "Ad hiding is best-effort and never complete.",
};

const FA: Record<MessageKey, string> = {
  appName: "OnlyFriends",
  tagline: "اینستاگرام، فقط دوستات.",
  settings: "تنظیمات",
  friends: "دوستان انتخاب‌شده",
  addFriend: "افزودن",
  friendPlaceholder: "نام کاربری",
  mode: "حالت فید",
  modeStrict: "فقط دوستان (سخت‌گیرانه)",
  modeStrictHint:
    "فقط پست‌هایی که نویسندهٔ آن‌ها در لیست شماست نمایش داده می‌شود. اگر نویسنده مشخص نباشد، پست مخفی می‌شود.",
  modeFollowing: "Following اینستاگرام",
  modeFollowingHint:
    "در صورت وجود، فید Following خود اینستاگرام را امتحان می‌کند. با لیست Strict Friends فرق دارد.",
  sessionLimit: "مدت نشست",
  dailyBudget: "بودجه روزانه",
  dailyBudgetOff: "خاموش",
  theme: "پوسته",
  themeLight: "روشن",
  themeDark: "تیره",
  themeSystem: "سیستم",
  language: "زبان",
  enabled: "OnlyFriends فعال",
  save: "ذخیره",
  saved: "ذخیره شد",
  minutes: "دقیقه",
  sessionEndTitle: "به‌روز شدی.",
  sessionEndBody: "برو از روزت لذت ببر.",
  overrideLimit: "کمی بیشتر ادامه بده",
  startNewSession: "شروع نشست تازه",
  timeRemaining: "زمان باقی‌مانده",
  blockedTitle: "این بخش موقتاً بسته است",
  blockedBody:
    "Explore و Reels در OnlyFriends مخفی‌اند تا پیش دوستانی بمانی که خودت انتخاب کردی.",
  goHome: "بازگشت به فید",
  openMessages: "پیام‌ها",
  unsupportedAuthors:
    "برخی پست‌ها نام کاربری مشخصی نداشتند و مخفی شدند (حالت امن).",
  emptyAllowlist: "برای حالت Strict Friends حداقل یک دوست اضافه کن.",
  followingUnavailable:
    "فید Following اینستاگرام پیدا نشد. در خانه می‌مانیم؛ فیلتر Strict در صورت فعال بودن اعمال می‌شود.",
  storyFilterPartial:
    "فیلتر استوری ناقص است — بعضی حلقه‌ها نام کاربری خوانا ندارند.",
  storyViewerUnsafe:
    "پیمایش بین استوری‌ها قابل فیلتر مطمئن نیست. فقط از سینی فیلتر‌شده باز کن.",
  privacyNote:
    "تنظیمات روی همین دستگاه می‌ماند. OnlyFriends رمز، پیام یا رسانهٔ اینستاگرام را نمی‌بیند.",
  limitations:
    "با تغییر ظاهر وب‌سایت اینستاگرامی که خودت وارد آن شده‌ای کار می‌کند. تغییر چیدمان اینستاگرام ممکن است دقت فیلتر را کم کند.",
  close: "بستن",
  remove: "حذف",
  noFriendsYet: "هنوز دوستی نیست — نام‌کاربری‌هایی که می‌خواهی ببینی را اضافه کن.",
  capabilities: "وضعیت قابلیت‌ها",
  adDisclaimer: "پنهان‌سازی تبلیغات بهترین تلاش است و کامل نیست.",
};

export function t(key: MessageKey, language: Language): string {
  return (language === "fa" ? FA : EN)[key];
}

export function dirForLanguage(language: Language): "rtl" | "ltr" {
  return language === "fa" ? "rtl" : "ltr";
}
