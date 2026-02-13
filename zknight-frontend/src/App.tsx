import { ZknightGame } from './games/zknight/ZknightGame';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  return (
    <LoadingScreen>
      <ZknightGame />
    </LoadingScreen>
  );
}
