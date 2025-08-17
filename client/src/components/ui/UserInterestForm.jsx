import React, { useState } from "react";
import { Badge } from "./badge";
import { Button } from "./button";

const interestsList = [
  "Web Development",
  "Data Science",
  "Machine Learning",
  "Mobile Development",
  "Cloud Computing",
  "Cybersecurity",
  "UI/UX Design",
  "Digital Marketing",
  "Business Analytics",
  "Project Management",
  "DevOps",
  "Blockchain",
];

export function UserInterestForm({
  initialInterests = [],
  onSubmit,
  loading = false,
  onBack,
}) {
  const [selected, setSelected] = useState(initialInterests);

  const toggleInterest = (interest) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(selected);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        {interestsList.map((interest) => (
          <Badge
            key={interest}
            variant={selected.includes(interest) ? "default" : "outline"}
            className="cursor-pointer p-2 text-center justify-center hover:bg-blue-100 transition-colors"
            onClick={() => toggleInterest(interest)}
          >
            {interest}
          </Badge>
        ))}
      </div>
      <div className="flex gap-3">
        {onBack && (
          <Button
            variant="outline"
            type="button"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
