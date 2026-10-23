# DeskManager: status

Last updated: 2026-10-23. Update this file when a step is finished.

## Done

**Auth**
- `role` is no longer accepted from the register request (always `user`).
- Register and login validate that all fields are present and are strings.

**Resources**
- `status` is `active` or `maintenance` (`booked` was removed; "booked" is computed from bookings).
- Optional unique `meshName` (unique + sparse index) links a resource to a node in the future 3D model.
- `updateResource` runs validators.
- A duplicate `meshName` returns 409 (shared helper `isDuplicateKeyError` in `utils/mongoErrors.ts`). An empty or whitespace-only `meshName` is not stored: on create it is left out, on update it is removed with `$unset`.
- `GET /api/resources/availability?from&to` returns all resources with `availability`: `free`, `booked` or `maintenance` (maintenance wins over booked).

**Bookings**
- `createBooking` validates: times present, valid dates, end after start, start not in the past, valid `resourceId`; conflicts return 409.
- `cancelBooking` implements the cancel rules from CLAUDE.md.
- `GET /api/availability?from&to&resourceId` returns confirmed bookings that overlap the range (used by the booking dialog).

**Frontend**
- `lib/booking-time.ts`: time options (09:00-21:00, 30-minute step), `toDateTime`, `dayRangeIso`, `overlaps`.
- Dashboard: date + From + To filters, Free / Booked badges, "Book Now" disabled when booked.
- Booking dialog: start and end selects, unavailable options disabled, prefilled from the dashboard, a start in the past is cleared, "unsaved changes" compares with the initial values.
- Bookings page: derived state labels (upcoming / in progress / completed / cancelled), cancel button follows the cancel rules.

**Tooling**
- Backend `tsc --noEmit` passes (removed `moduleResolution` and `ignoreDeprecations` for TypeScript 7).
- `npm run dev` in `backend` runs `tsx watch`.
- Backend tests: Vitest + Supertest + mongodb-memory-server, `npm test` in `backend`. `app.ts` (Express app) is split from `server.ts` (env, DB connection, listen) so tests can use the app without a real database.
- `src/__tests__/resources.test.ts`: 8 tests for POST/PUT `/api/resources` and `meshName`.

## Next steps (in this order)

1. `meshName` field in the admin resources form (send nothing when empty).
2. Data integrity when a resource or user is deleted. **Decision made: block deletion while active bookings exist.**
   - "Active" means `confirmed` and not yet ended (upcoming or in progress).
   - If any exist, `deleteResource` / `deleteUser` return 409 with a message like "Cancel active bookings first". Otherwise the delete goes through.
   - Past (completed) and cancelled bookings stay as history.
   - To take a resource out of use without deleting it, an admin sets its status to `maintenance`.
   - Frontend: where a booking's resource or user no longer exists (`null` after populate), show "(deleted resource)" / "(deleted user)" instead of an empty card.
   - Tests first (409 with an active booking; delete works with only past or cancelled bookings; the self-delete guard still works).
3. Cleanup:
   - ESLint (about 21 findings): `any` in catch blocks, setState in effects, function used before declaration, one missing dependency, one unescaped apostrophe.
   - Controllers use both `Promise<void>` and `Promise<any>` as return types; pick one style.
   - No test yet for a PUT that changes fields other than `meshName` (skipped on purpose).
   - `meshName` that is not a string (array, object) gives 500 instead of 400.
   - `alert()` on the bookings page should be a `toast` (sonner is already used in admin).
   - Normalize email (`trim`, `toLowerCase`) and trim names on register.
   - One import path for `cn` (`@/lib/utils`).
4. Figure out why some endpoints (I've only noticed this with GET requests) return a 304 (or something like that) instead of the usual 200
5. Interactive 3D office map (React Three Fiber): load `.glb`, map `meshName` to resources, color by availability from `GET /api/resources/availability` (green free, grey booked, red maintenance), `OrbitControls`, refresh by polling every 15-30 s, load with `next/dynamic` and `ssr: false`.
6. Admin dashboard with Recharts (daily office occupancy in percent).
7. Final pass: bring the thesis document in line with the code (list below).

## Known limitations (describe in the thesis)
- The JWT carries the role for one day: a changed role applies only after the token expires.
- The conflict check and the insert are not atomic, so two simultaneous requests could both pass the check.
- Response time requirement WN06 (500 ms) has not been measured.

## Changes needed in the thesis document
- Add the endpoints `GET /api/availability` and `GET /api/resources/availability`, and `AvailabilityController` in the class diagram.
- Add `UserController` (list users, change role, delete user) to the class diagram and the user management use case.
- `Resource.status` is `active | maintenance` (remove `booked`); add the optional unique `meshName`.
- Describe the three derived booking states and the cancel rules (table). The stored status stays `confirmed | cancelled`.
- Describe the deletion rule: a resource or user with active bookings cannot be deleted (409); past and cancelled bookings are kept as history; `maintenance` is the way to take a resource out of use.
- Describe time handling: UTC in the database, local time in the UI, intervals chosen in 30-minute steps within working hours.
- Tech stack: Zustand is used only for auth state, not for request caching; the calendar is the shadcn Calendar (`react-day-picker`) and not a native date input; development runs with `tsx watch` (nodemon is installed but not used); add the libraries actually used (`sonner`, `date-fns`, `bcrypt`, `dotenv`, `phosphor-icons`, `cn`).
- WF04/WF05: the user picks a date and a start and end time; the dashboard shows free or booked resources for that interval.
- "Monitoring office occupancy" (admin function) is planned, not done (see next step 6).