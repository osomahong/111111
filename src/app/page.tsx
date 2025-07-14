import HomeClient from './HomeClient';

export const metadata = {
  title: "당신이 받은 메일.. 진심일까요? | K직장인 속마음 번역기",
  description: "K직장인 속마음 번역기는 이메일의 진짜 속마음을 번역해주는 서비스입니다. 받은 메일의 본문을 입력하고, 발신자의 진심을 확인해보세요.",
  openGraph: {
    title: "당신이 받은 메일.. 진심일까요? | K직장인 속마음 번역기",
    description: "K직장인 속마음 번역기는 이메일의 진짜 속마음을 번역해주는 서비스입니다.",
    url: "https://111111-pi.vercel.app/",
    images: ["/assets/kworker-icon.png"],
  },
  alternates: {
    canonical: "https://111111-pi.vercel.app/",
  },
};

export default function Home() {
  return <HomeClient />;
}
