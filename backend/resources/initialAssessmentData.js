const dass21 = {
  title: "DASS-21 (Depression, Anxiety and Stress Scale - 21 Items)",
  description:
    "This is the official 21-item version of the DASS for measuring depression, anxiety, and stress.",
  scale: {
    label:
      "Please read each statement and circle a number 0, 1, 2 or 3 that indicates how much the statement applied to you over the past week.",
    options: [
      { value: 0, label: "Did not apply to me at all" },
      { value: 1, label: "Applied to me to some degree, or some of the time" },
      {
        value: 2,
        label: "Applied to me to a considerable degree, or a good part of time",
      },
      { value: 3, label: "Applied to me very much, or most of the time" },
    ],
  },
  sections: [
    {
      category: "Depression",
      questions: [
        {
          id: "D1",
          question:
            "I couldn't seem to experience any positive feeling at all.",
        },
        {
          id: "D2",
          question:
            "I found it difficult to work up the initiative to do things.",
        },
        { id: "D3", question: "I felt that I had nothing to look forward to." },
        { id: "D4", question: "I felt down-hearted and blue." },
        {
          id: "D5",
          question: "I was unable to become enthusiastic about anything.",
        },
        { id: "D6", question: "I felt I wasn’t worth much as a person." },
        { id: "D7", question: "I felt that life was meaningless." },
      ],
    },
    {
      category: "Anxiety",
      questions: [
        { id: "A1", question: "I was aware of dryness of my mouth." },
        {
          id: "A2",
          question:
            "I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion).",
        },
        { id: "A3", question: "I experienced trembling (e.g., in the hands)." },
        {
          id: "A4",
          question:
            "I was worried about situations in which I might panic and make a fool of myself.",
        },
        { id: "A5", question: "I felt I was close to panic." },
        {
          id: "A6",
          question:
            "I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat).",
        },
        { id: "A7", question: "I felt scared without any good reason." },
      ],
    },
    {
      category: "Stress",
      questions: [
        { id: "S1", question: "I found it hard to wind down." },
        { id: "S2", question: "I tended to over-react to situations." },
        {
          id: "S3",
          question: "I felt that I was using a lot of nervous energy.",
        },
        { id: "S4", question: "I found myself getting agitated." },
        { id: "S5", question: "I found it difficult to relax." },
        {
          id: "S6",
          question:
            "I was intolerant of anything that kept me from getting on with what I was doing.",
        },
        { id: "S7", question: "I felt that I was rather touchy." },
      ],
    },
  ],
};

module.exports = dass21;
