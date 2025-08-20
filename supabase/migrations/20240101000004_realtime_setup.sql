-- Enable realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;

-- Create function to notify on game state changes
CREATE OR REPLACE FUNCTION notify_game_state_change() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'game_state_change',
    json_build_object(
      'room_id', NEW.room_id,
      'version', NEW.version,
      'current_player', NEW.current_player,
      'last_action', NEW.last_action
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for game state changes
DROP TRIGGER IF EXISTS game_state_change_trigger ON game_states;
CREATE TRIGGER game_state_change_trigger
  AFTER INSERT OR UPDATE ON game_states
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_state_change();

-- Create function to clean up abandoned rooms
CREATE OR REPLACE FUNCTION cleanup_abandoned_rooms() RETURNS void AS $$
BEGIN
  -- Mark rooms as abandoned if no activity for 30 minutes
  UPDATE rooms
  SET status = 'abandoned'
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '30 minutes';
  
  -- Delete abandoned rooms older than 24 hours
  DELETE FROM rooms
  WHERE status = 'abandoned'
    AND (finished_at < NOW() - INTERVAL '24 hours' 
         OR created_at < NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up rooms (requires pg_cron extension)
-- This would need to be set up separately in Supabase dashboard
-- SELECT cron.schedule('cleanup-rooms', '*/15 * * * *', 'SELECT cleanup_abandoned_rooms();');