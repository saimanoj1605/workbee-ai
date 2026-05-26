"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Briefcase, Award, Star, Edit, Camera, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const skills = [
    "UI/UX Design",
    "React",
    "TypeScript",
    "Figma",
    "Adobe XD",
    "Tailwind CSS",
    "Motion Design",
    "Prototyping",
  ];

  const achievements = [
    {
      icon: Award,
      title: "Top Performer",
      description: "Ranked in top 5% of all workers",
      color: "text-yellow-400",
    },
    {
      icon: CheckCircle,
      title: "100% Success Rate",
      description: "All projects completed successfully",
      color: "text-green-400",
    },
    {
      icon: Star,
      title: "5.0 Rating",
      description: "Perfect score from 47 reviews",
      color: "text-primary",
    },
  ];

  const experiences = [
    {
      title: "Senior UI Designer",
      company: "Design Studio Pro",
      period: "Jan 2025 - Present",
      description: "Led design projects for 15+ clients",
    },
    {
      title: "Frontend Developer",
      company: "CodeCraft Labs",
      period: "Jun 2024 - Dec 2024",
      description: "Built responsive web applications",
    },
    {
      title: "Freelance Designer",
      company: "Self-Employed",
      period: "Jan 2024 - May 2024",
      description: "Completed 30+ design projects",
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-20 px-4 md:px-6 bg-background text-foreground">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-5xl font-bold text-background">
                A
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 p-2 bg-primary rounded-lg opacity-0 group-hover:opacity-100 smooth-transition"
              >
                <Camera className="w-4 h-4 text-background" />
              </motion.button>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-background"></div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Alex Johnson</h1>
                  <p className="text-lg text-muted-foreground mb-3">UI/UX Designer & Frontend Developer</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      alex.johnson@email.com
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      +1 (555) 123-4567
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      San Francisco, CA
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 smooth-transition"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="text-2xl font-bold text-primary mb-1">47</div>
                  <div className="text-xs text-muted-foreground">Completed Jobs</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="text-2xl font-bold text-primary mb-1">5.0</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="text-2xl font-bold text-primary mb-1">$12.5K</div>
                  <div className="text-xs text-muted-foreground">Earned</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Passionate UI/UX designer with 3+ years of experience creating beautiful, user-centered digital experiences. I specialize in modern web design, prototyping, and bringing ideas to life through code. My approach combines aesthetic excellence with functional design principles.
            </p>

            <h3 className="text-xl font-semibold mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium text-sm smooth-transition cursor-pointer hover:bg-primary/20"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Achievements</h2>
            <div className="space-y-4">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition"
                  >
                    <Icon className={`${achievement.color} w-6 h-6 mb-2`} />
                    <div className="font-semibold mb-1">{achievement.title}</div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Experience</h2>
          </div>

          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="relative pl-6 border-l-2 border-primary/30 hover:border-primary smooth-transition"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary pulse-glow"></div>
                <div className="pb-6">
                  <h3 className="text-lg font-semibold mb-1">{exp.title}</h3>
                  <div className="text-sm text-primary mb-2">{exp.company}</div>
                  <div className="text-xs text-muted-foreground mb-2">{exp.period}</div>
                  <p className="text-sm text-muted-foreground">{exp.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
