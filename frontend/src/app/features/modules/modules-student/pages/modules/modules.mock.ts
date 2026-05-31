import { ModuleOverviewModel } from "../../model/module-overview.model";

export const MOCK_STUDENT_MODULES: ModuleOverviewModel[] = [
  {
    id: 1,
    name: "Choix du sujet et du client",
    status: {
      locked: false,
    },
    groups: [
      { id: 1, type: "FORM", state: "SUBMITTED", date: new Date("2026-06-15") },
      { id: 2, type: "FORM", state: "SUBMITTED", date: new Date("2026-06-15") }
    ]
  },

  {
    id: 2,
    name: "Rencontre 2T - 3T",
    status: {
      locked: false,
    },
    groups: [
      { id: 3, type: "ACTIVITY", state: "UNTOUCHED", date: new Date("2026-07-01") },
    ]
  },

  {
    id: 3,
    name: "Cahier des charges",
    status: {
      locked: false,
    },
    groups: [
      { id: 4, type: "FORM", state: "SUBMITTED", date: new Date("2026-08-10") },
      { id: 5, type: "FORM", state: "UNTOUCHED", date: new Date("2026-08-20") },
      { id: 6, type: "WORK", state: "UNTOUCHED", date: new Date("2026-08-20") },
      { id: 7, type: "ASSESSMENT", state: "UNTOUCHED" },
    ]
  },

  {
    id: 4,
    name: "Analyse",
    status: {
      locked: false,
    },
    groups: [
      { id: 8, type: "WORK", state: "UNTOUCHED", date: new Date("2026-08-30") },
      { id: 9, type: "ASSESSMENT", state: "UNTOUCHED" },
    ]
  },
  {
    id: 5,
    name: "Défense finale",
    status: {
      locked: true,
      lockedBy: [
        {
          id: 1,
          method: "DATE",
          date: new Date("2026-06-01"),
        }
      ]
    },
    groups: [
      { id: 10, type: "ACTIVITY", state: "UNTOUCHED", date: new Date("2026-07-01") },
    ]
  },
];