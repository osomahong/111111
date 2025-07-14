import InfoClient from './InfoClient';

export const metadata = {
  title: "당신이 받은 메일의 정보를 입력해주세요. | K직장인 속마음 번역기",
  description: "받은 메일의 발신자와 본문을 입력하면, K직장인 속마음 번역기가 진심을 분석해드립니다.",
  openGraph: {
    title: "당신이 받은 메일의 정보를 입력해주세요. | K직장인 속마음 번역기",
    description: "받은 메일의 발신자와 본문을 입력하면, K직장인 속마음 번역기가 진심을 분석해드립니다.",
    url: "https://111111-pi.vercel.app/info",
    images: ["/assets/kworker-icon.png"],
  },
  alternates: {
    canonical: "https://111111-pi.vercel.app/info",
  },
};

export default function InfoPage() {
  return <InfoClient />;
} 