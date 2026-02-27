import { GameProvider, useGame } from './game/GameContext.jsx'
import Lobby from './components/Lobby.jsx'
import GameBoard from './components/GameBoard.jsx'

function Router() {
  const { roomState } = useGame()

  if (roomState.inLobby) {
    return <Lobby />
  }

  return <GameBoard />
}

export default function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  )
}
