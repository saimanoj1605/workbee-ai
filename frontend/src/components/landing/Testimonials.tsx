"use client";

import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      rating: 5,
      text: "WorkBee changed my college experience. I can find shifts that fit perfectly around my classes and actually enjoy my work!",
      author: "Sarah Chen",
      stat: "$4,200/mo",
    },
    {
      rating: 5,
      text: "Was stuck doing random hours posting on multiple platforms. Now I've got solid and get matched candidates in minutes. Not hours.",
      author: "Michael Torres",
      stat: "50+ hours",
    },
    {
      rating: 5,
      text: "The AI matching is scary good. It sometimes knows what kind of gigs I'd enjoy before I even apply!",
      author: "Jordan Davis",
      stat: "$3,800/mo",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted mb-6">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by <span className="text-primary">thousands</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-primary font-bold">{testimonial.stat}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
