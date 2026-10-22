import { Intro } from '@/components/Intro';
import { close } from '@/lib/nav';

/** Einführung erneut ansehen (aus den Einstellungen). */
export default function IntroScreen() {
  return <Intro onDone={close} />;
}
