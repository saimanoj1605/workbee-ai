"use client";

import { motion } from "framer-motion";
import { UserPlus, Target, DollarSign } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Create Your Profile",
      description:
        "Sign up in seconds and tell us about your skills, experience, and what you're looking for in your ideal gig.",
    },
    {
      number: "02",
      icon: Target,
      title: "Get AI Matched",
      description:
        "Our advanced AI analyzes thousands of local opportunities and matches you with the perfect gigs based on your profile.",
    },
    {
      number: "03",
      icon: DollarSign,
      title: "Start Earning",
      description:
        "Accept gigs that work for you, complete the work, and get paid instantly. Build your reputation and unlock more opportunities.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
            How it Works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Start earning in <span className="text-primary">minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to unlock local opportunities
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                <div className="absolute -top-4 left-0 text-8xl font-bold text-muted/20 select-none">
                  {step.number}
                </div>

                <div className="relative bg-card rounded-2xl p-8 border border-border hover:border-primary/50 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
