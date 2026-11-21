// Serverless Function (FaaS) - HTTP Trigger Handler
// Изпълнява се при поискване без поддържане на постоянен сървър (Stateless)

const scienceFacts = [
    { id: 1, category: "chemistry", fact: "Водата е единственото вещество на Земята, което се среща естествено в трите агрегатни състояния." },
    { id: 2, category: "physics", fact: "Светлината пътува от Слънцето до Земята за около 8 минути и 20 секунди." },
    { id: 3, category: "biology", fact: "Човешкото ДНК е на 99.9% идентично при всички хора по света." },
    { id: 4, category: "astronomy", fact: "Един ден на Венера е по-дълъг от една година на Венера." }
];

export default async function handler(req, res) {
    const dayIndex = new Date().getDate() % scienceFacts.length;
    const selectedFact = scienceFacts[dayIndex];

    const responsePayload = {
        service: "WonderSci-FaaS-ScienceFact",
        executionMode: "Serverless / Stateless",
        timestamp: new Date().toISOString(),
        data: selectedFact
    };

    if (res && typeof res.status === "function") {
        return res.status(200).json(responsePayload);
    }

    return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
