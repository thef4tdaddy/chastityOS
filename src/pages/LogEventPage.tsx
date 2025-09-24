import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from '../contexts';
import { eventDBService } from '../services/database';
import type { DBEvent, EventType } from '../types/database';
import {
  FaArrowLeft,
  FaPlus,
  FaCalendar,
  FaHeart,
  FaFire,
  FaGamepad,
  FaTint,
  FaSpinner,
} from 'react-icons/fa';

// Event type definitions with modern icons
const EVENT_TYPES = [
  {
    value: 'orgasm' as EventType,
    label: 'Orgasm',
    icon: FaHeart,
    color: 'text-red-400',
    description: 'Self or partner induced orgasm'
  },
  {
    value: 'sexual_activity' as EventType,
    label: 'Sexual Activity',
    icon: FaFire,
    color: 'text-orange-400',
    description: 'Sexual play or activity'
  },
  {
    value: 'milestone' as EventType,
    label: 'Milestone',
    icon: FaGamepad,
    color: 'text-nightly-aquamarine',
    description: 'Achievement or milestone reached'
  },
  {
    value: 'note' as EventType,
    label: 'Note',
    icon: FaTint,
    color: 'text-nightly-lavender-floral',
    description: 'General note or observation'
  },
];

// Event Form Component
const LogEventForm: React.FC<{
  onEventLogged: (event: Omit<DBEvent, 'id' | 'lastModified' | 'syncStatus'>) => void;
}> = ({ onEventLogged }) => {
  const { user } = useAuthState();
  const [formData, setFormData] = useState({
    type: 'note' as EventType,
    notes: '',
    timestamp: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    mood: '',
    intensity: 5,
    tags: '',
    isPrivate: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const eventData: Omit<DBEvent, 'id' | 'lastModified' | 'syncStatus'> = {
        userId: user.uid,
        type: formData.type,
        timestamp: new Date(formData.timestamp),
        details: {
          notes: formData.notes,
          mood: formData.mood,
          intensity: formData.intensity,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        },
        isPrivate: formData.isPrivate,
      };

      await eventDBService.create({
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      onEventLogged(eventData);

      // Reset form
      setFormData({
        type: 'note' as EventType,
        notes: '',
        timestamp: new Date().toISOString().slice(0, 16),
        mood: '',
        intensity: 5,
        tags: '',
        isPrivate: false,
      });
    } catch (error) {
      console.error('Error logging event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaPlus className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nighty-honeydew">Log New Event</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Type Selection */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-3">
            Event Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EVENT_TYPES.map((eventType) => {
              const Icon = eventType.icon;
              return (
                <button
                  key={eventType.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: eventType.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === eventType.value
                      ? 'border-nightly-aquamarine bg-nightly-aquamarine/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`text-lg mb-2 mx-auto ${
                    formData.type === eventType.value ? 'text-nightly-aquamarine' : eventType.color
                  }`} />
                  <div className={`text-sm font-medium ${
                    formData.type === eventType.value ? 'text-nighty-honeydew' : 'text-nightly-celadon'
                  }`}>
                    {eventType.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timestamp */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={formData.timestamp}
            onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Describe the event..."
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Mood
            </label>
            <input
              type="text"
              value={formData.mood}
              onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
              placeholder="Happy, frustrated, excited..."
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50"
            />
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Intensity (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.intensity}
              onChange={(e) => setFormData(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
              className="w-full mb-2"
            />
            <div className="text-center text-nighty-honeydew">{formData.intensity}</div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="romantic, intense, relaxed..."
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50"
          />
        </div>

        {/* Privacy */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">Private Event</div>
            <div className="text-xs text-nightly-celadon/70">Keep this event private</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPrivate}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-6 py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin" />
              Logging Event...
            </>
          ) : (
            <>
              <FaPlus />
              Log Event
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// Event List Component
const EventList: React.FC<{ events: DBEvent[] }> = ({ events }) => {
  const getEventTypeInfo = (type: EventType) => {
    return EVENT_TYPES.find(et => et.value === type) || EVENT_TYPES[3]; // Default to note
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="text-center py-8">
          <FaCalendar className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
          <div className="text-nightly-celadon">No events logged yet</div>
          <div className="text-sm text-nightly-celadon/70">Log your first event above</div>
        </div>
      ) : (
        events.map((event) => {
          const eventTypeInfo = getEventTypeInfo(event.type);
          const Icon = eventTypeInfo.icon;

          return (
            <div key={event.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className={eventTypeInfo.color} />
                  <div>
                    <h3 className="font-medium text-nighty-honeydew">
                      {eventTypeInfo.label}
                    </h3>
                    <div className="text-xs text-nightly-celadon">
                      {formatDate(event.timestamp)}
                    </div>
                  </div>
                </div>
                {event.isPrivate && (
                  <span className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded">
                    Private
                  </span>
                )}
              </div>

              {/* Content */}
              {event.details.notes && (
                <p className="text-nighty-honeydew mb-3">{event.details.notes}</p>
              )}

              {/* Details */}
              <div className="flex gap-4 text-xs text-nightly-celadon">
                {event.details.mood && <span>Mood: {event.details.mood}</span>}
                {event.details.intensity && <span>Intensity: {event.details.intensity}/10</span>}
              </div>

              {/* Tags */}
              {event.details.tags && event.details.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {event.details.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-2 py-1 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

const LogEventPage: React.FC = () => {
  const { user } = useAuthState();
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userEvents = await eventDBService.findByUserId(user.uid);
        // Sort by timestamp descending (newest first)
        userEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setEvents(userEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleEventLogged = (newEvent: Omit<DBEvent, 'id' | 'lastModified' | 'syncStatus'>) => {
    // Add the new event to the top of the list
    const eventWithDefaults: DBEvent = {
      ...newEvent,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastModified: new Date(),
      syncStatus: 'pending',
    };
    setEvents(prev => [eventWithDefaults, ...prev]);
  };

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-nightly-aquamarine hover:text-nightly-spring-green">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Log Event</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl">
        <LogEventForm onEventLogged={handleEventLogged} />

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-nighty-honeydew mb-6">Recent Events</h2>

          {loading ? (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
              <div className="text-nightly-celadon">Loading events...</div>
            </div>
          ) : (
            <EventList events={events} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LogEventPage;