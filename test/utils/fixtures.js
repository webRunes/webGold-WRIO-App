/**
 * Created by michbil on 15.04.17.
 */


export function generateSession(userID) {
    return {
        _id: "--QGt2nm4GYtw3a5uIRoFQgmy2-fWvaW",
            expires: new Date(909090909090990),
        session: JSON.stringify({
        cookie: {
            "originalMaxAge": 0,
            expires: "2025-11-22"
        },
        passport: {
            user: userID
        }
    })
    };
}