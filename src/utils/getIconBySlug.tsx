import {
  Briefcase,
  Car,
  DollarSign,
  Film,
  Heart,
  Home,
  Lightbulb,
  Package,
  TrendingUp,
  Utensils,
} from "lucide-react";

export const getIconBySlug = (icon: string) => {
  switch (icon) {
    case "Utensils":
      return <Utensils className="mr-2 h-4 w-4" />;
    case "Car":
      return <Car className="mr-2 h-4 w-4" />;
    case "Home":
      return <Home className="mr-2 h-4 w-4" />;
    case "Lightbulb":
      return <Lightbulb className="mr-2 h-4 w-4" />;
    case "Film":
      return <Film className="mr-2 h-4 w-4" />;
    case "Heart":
      return <Heart className="mr-2 h-4 w-4" />;
    case "Briefcase":
      return <Briefcase className="mr-2 h-4 w-4" />;
    case "TrendingUp":
      return <TrendingUp className="mr-2 h-4 w-4" />;
    case "DollarSign":
      return <DollarSign className="mr-2 h-4 w-4" />;
    default:
      return <Package className="mr-2 h-4 w-4" />;
  }
};
