import EmailAuthClient from './EmailAuthClient';

export const metadata = {
  title: "실제 사용하는 이메일을 인증해주세요. | K직장인 속마음 번역기",
  description: "이메일 인증을 통해 안전하게 서비스를 이용하세요. 입력하신 이메일은 저장되지 않습니다.",
  openGraph: {
    title: "실제 사용하는 이메일을 인증해주세요. | K직장인 속마음 번역기",
    description: "이메일 인증을 통해 안전하게 서비스를 이용하세요.",
    url: "https://111111-pi.vercel.app/email-auth",
    images: ["/assets/kworker-icon.png"],
  },
  alternates: {
    canonical: "https://111111-pi.vercel.app/email-auth",
  },
};

export default function EmailAuthPage() {
  return <EmailAuthClient />;
} 