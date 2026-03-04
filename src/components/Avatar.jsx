import idleGif from '../assets/memoji/idle.gif';
import listeningGif from '../assets/memoji/listening.gif';
import talkingGif from '../assets/memoji/talking.gif';

export default function Avatar({ state = 'idle' }) {
  const src =
    state === 'talking' ? talkingGif : state === 'listening' ? listeningGif : idleGif;

  return (
    <div className="avatarCircle" role="img" aria-label="Priyank memoji avatar">
      <img className="avatarImg" src={src} alt="" draggable="false" />
    </div>
  );
}
