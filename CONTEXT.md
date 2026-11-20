# Pomodoro Timer

A local web page that times alternating periods of focused work and rest.

## Language

**Phase**:
One continuous countdown of a fixed length; either a Focus or a Break.

**Focus**:
A Phase for concentrated work; 30 minutes unless the user's Settings say otherwise.
_Avoid_: Work, session

**Break**:
A Phase of rest that follows a Focus; 7 minutes unless the user's Settings say otherwise. There is no separate long break.
_Avoid_: Rest, pause

**Pomodoro**:
One Focus followed by its Break, taken together. Counted as complete as soon as its Focus runs to zero — finishing or skipping the Break doesn't change the count.
_Avoid_: Session, round

**Settings**:
The user's chosen Focus and Break lengths. They are kept between visits, and a change takes effect from the next Phase.

## Relationships

- A **Pomodoro** consists of exactly one **Focus** then one **Break**
- **Phases** alternate: Focus → Break → Focus → …
- A Focus that is skipped or reset before reaching zero does not produce a **Pomodoro**
- A new **Phase** never starts on its own; the user starts each one

## Flagged ambiguities

- "Pomodoro" is sometimes used to mean only the focus block; here it means Focus + Break together.
