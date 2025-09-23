// src/components/log_event/LogEventForm.jsx
import React from "react";
import { EVENT_TYPE_DEFINITIONS } from "../../event_types.js"; // Changed import

const LogEventForm = ({
  isAuthReady,
  newEventDate,
  setNewEventDate,
  newEventTime,
  setNewEventTime,
  selectedEventTypes,
  handleEventTypeChange,
  otherEventTypeChecked,
  handleOtherEventTypeCheckChange,
  otherEventTypeDetail,
  setOtherEventTypeDetail,
  newEventNotes,
  setNewEventNotes,
  newEventDurationHours,
  setNewEventDurationHours,
  newEventDurationMinutes,
  setNewEventDurationMinutes,
  newEventSelfOrgasmAmount,
  setNewEventSelfOrgasmAmount,
  newEventPartnerOrgasmAmount,
  setNewEventPartnerOrgasmAmount,
  handleLogNewEvent,
  eventLogMessage,
  isLoadingEvents,
  isSubmitting,
  savedSubmissivesName,
  keyholderName,
  eventDisplayMode,
  isNightly, // Added isNightly prop for dynamic classes
}) => {
  const showSelfOrgasmAmountInput =
    selectedEventTypes.includes("Orgasm (Self)");
  const showPartnerOrgasmAmountInput =
    selectedEventTypes.includes("Orgasm (Partner)");

  // Filter event types based on userSelectable and current eventDisplayMode
  const filteredEventTypes = EVENT_TYPE_DEFINITIONS.filter(
    (typeDef) =>
      typeDef.userSelectable &&
      (eventDisplayMode === "kinky" || typeDef.mode === "vanilla"),
  );

  return (
    <form
      onSubmit={handleLogNewEvent}
      className={`mb-8 p-4 rounded-lg border space-y-4 
    ${isNightly ? "bg-nightly-bg border-nightly-border" : "bg-prod-bg border-prod-border"}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="eventDate"
            className={`block text-sm font-medium text-left ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
          >
            Event Date:
          </label>
          <input
            type="date"
            id="eventDate"
            value={newEventDate}
            onChange={(e) => setNewEventDate(e.target.value)}
            required
            className={`mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent`}
          />
        </div>
        <div>
          <label
            htmlFor="eventTime"
            className={`block text-sm font-medium text-left ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
          >
            Event Time:
          </label>
          <input
            type="time"
            id="eventTime"
            value={newEventTime}
            onChange={(e) => setNewEventTime(e.target.value)}
            required
            className={`mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent`}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="eventDurationHours"
            className={`block text-sm font-medium text-left ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
          >
            Duration (Hours):
          </label>
          <input
            type="number"
            id="eventDurationHours"
            value={newEventDurationHours}
            onChange={(e) => setNewEventDurationHours(e.target.value)}
            min="0"
            placeholder="H"
            className={`mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent`}
          />
        </div>
        <div>
          <label
            htmlFor="eventDurationMinutes"
            className={`block text-sm font-medium text-left ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
          >
            Duration (Minutes):
          </label>
          <input
            type="number"
            id="eventDurationMinutes"
            value={newEventDurationMinutes}
            onChange={(e) => setNewEventDurationMinutes(e.target.value)}
            min="0"
            max="59"
            placeholder="M"
            className={`mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent`}
          />
        </div>
      </div>
      <div>
        <label
          className={`block text-sm font-medium text-left mb-1 ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
        >
          Event Type(s):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredEventTypes.map((typeDef) => {
            // Changed to filteredEventTypes
            const type = typeDef.name;
            const displayLabel =
              type === "Orgasm (Self)" && savedSubmissivesName
                ? `Orgasm (${savedSubmissivesName})`
                : type === "Orgasm (Partner)" && keyholderName
                  ? `Orgasm (${keyholderName})`
                  : type;
            return (
              <label
                key={type}
                className="flex items-center space-x-2 text-sm"
                style={{ color: isNightly ? undefined : undefined }}
              >
                <input
                  type="checkbox"
                  checked={selectedEventTypes.includes(type)}
                  onChange={() => handleEventTypeChange(type)}
                  className="form-checkbox h-4 w-4 text-accent bg-app-input border-app-border rounded focus:ring-accent"
                />
                <span className={`text-accent`}>{displayLabel}</span>
              </label>
            );
          })}
          <label key="other" className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={otherEventTypeChecked}
              onChange={handleOtherEventTypeCheckChange}
              className="form-checkbox h-4 w-4 text-accent bg-app-input border-app-border rounded focus:ring-accent"
            />
            <span className="text-accent">Other</span>
          </label>
        </div>
        {otherEventTypeChecked && (
          <input
            type="text"
            value={otherEventTypeDetail}
            onChange={(e) => setOtherEventTypeDetail(e.target.value)}
            placeholder="Specify other type"
            className="mt-2 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent text-sm"
          />
        )}
      </div>
      {showSelfOrgasmAmountInput && (
        <div>
          <label
            htmlFor="selfOrgasmAmount"
            className={`block text-sm font-medium text-left ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
          >
            {savedSubmissivesName
              ? `Orgasm (${savedSubmissivesName}) Count:`
              : "Orgasm (Self) Count:"}
          </label>
          <input
            type="number"
            id="selfOrgasmAmount"
            value={newEventSelfOrgasmAmount}
            onChange={(e) => setNewEventSelfOrgasmAmount(e.target.value)}
            min="1"
            placeholder="Count"
            className={`mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent`}
          />
        </div>
      )}
      {showPartnerOrgasmAmountInput && (
        <div>
          <label
            htmlFor="partnerOrgasmAmount"
            className={`block text-sm font-medium text-left ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
          >
            {keyholderName
              ? `Orgasm (${keyholderName}) Count:`
              : "Partner Orgasm Count:"}
          </label>
          <input
            type="number"
            id="partnerOrgasmAmount"
            value={newEventPartnerOrgasmAmount}
            onChange={(e) => setNewEventPartnerOrgasmAmount(e.target.value)}
            min="1"
            placeholder="Count"
            className={`mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent`}
          />
        </div>
      )}
      <div>
        <label
          htmlFor="eventNotes"
          className={`block text-sm font-medium text-left ${isNightly ? "text-nightly-accent" : "text-prod-accent"}`}
        >
          Notes:
        </label>
        <textarea
          id="eventNotes"
          value={newEventNotes}
          onChange={(e) => setNewEventNotes(e.target.value)}
          rows="3"
          className={`mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent`}
          placeholder="Optional details..."
        ></textarea>
      </div>
      <button
        type="submit"
        disabled={!isAuthReady || isLoadingEvents || isSubmitting}
        className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
      >
        Log Event
      </button>
      {eventLogMessage && (
        <p
          className={`text-sm mt-2 ${eventLogMessage.includes("success") ? "text-green-400" : "text-red-500"}`}
        >
          {eventLogMessage}
        </p>
      )}
    </form>
  );
};
export default LogEventForm;
