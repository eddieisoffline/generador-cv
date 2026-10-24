/* Material Symbols Rounded (Apache-2.0), inlined as SVG paths: no icon font,
   no network request. Filled variants mark the open section in the rail. */

import badgeSvg from "@material-symbols/svg-400/rounded/badge.svg?raw";
import schoolSvg from "@material-symbols/svg-400/rounded/school.svg?raw";
import workSvg from "@material-symbols/svg-400/rounded/work.svg?raw";
import groupsSvg from "@material-symbols/svg-400/rounded/groups.svg?raw";
import psychologySvg from "@material-symbols/svg-400/rounded/psychology.svg?raw";
import rocketLaunchSvg from "@material-symbols/svg-400/rounded/rocket_launch.svg?raw";
import volunteerActivismSvg from "@material-symbols/svg-400/rounded/volunteer_activism.svg?raw";
import verifiedSvg from "@material-symbols/svg-400/rounded/verified.svg?raw";
import militaryTechSvg from "@material-symbols/svg-400/rounded/military_tech.svg?raw";
import menuBookSvg from "@material-symbols/svg-400/rounded/menu_book.svg?raw";
import visibilitySvg from "@material-symbols/svg-400/rounded/visibility.svg?raw";
import visibilityOffSvg from "@material-symbols/svg-400/rounded/visibility_off.svg?raw";
import moreHorizSvg from "@material-symbols/svg-400/rounded/more_horiz.svg?raw";
import addSvg from "@material-symbols/svg-400/rounded/add.svg?raw";
import deleteSvg from "@material-symbols/svg-400/rounded/delete.svg?raw";
import arrowUpwardSvg from "@material-symbols/svg-400/rounded/arrow_upward.svg?raw";
import arrowDownwardSvg from "@material-symbols/svg-400/rounded/arrow_downward.svg?raw";
import contentCopySvg from "@material-symbols/svg-400/rounded/content_copy.svg?raw";
import downloadSvg from "@material-symbols/svg-400/rounded/download.svg?raw";
import settingsSvg from "@material-symbols/svg-400/rounded/settings.svg?raw";
import keyboardArrowDownSvg from "@material-symbols/svg-400/rounded/keyboard_arrow_down.svg?raw";
import closeSvg from "@material-symbols/svg-400/rounded/close.svg?raw";
import descriptionSvg from "@material-symbols/svg-400/rounded/description.svg?raw";
import uploadFileSvg from "@material-symbols/svg-400/rounded/upload_file.svg?raw";
import shieldLockSvg from "@material-symbols/svg-400/rounded/shield_lock.svg?raw";
import errorSvg from "@material-symbols/svg-400/rounded/error.svg?raw";
import checkSvg from "@material-symbols/svg-400/rounded/check.svg?raw";
import checkCircleSvg from "@material-symbols/svg-400/rounded/check_circle.svg?raw";
import infoSvg from "@material-symbols/svg-400/rounded/info.svg?raw";
import pictureAsPdfSvg from "@material-symbols/svg-400/rounded/picture_as_pdf.svg?raw";
import menuSvg from "@material-symbols/svg-400/rounded/menu.svg?raw";
import restartAltSvg from "@material-symbols/svg-400/rounded/restart_alt.svg?raw";
import articleSvg from "@material-symbols/svg-400/rounded/article.svg?raw";
import badgeFillSvg from "@material-symbols/svg-400/rounded/badge-fill.svg?raw";
import schoolFillSvg from "@material-symbols/svg-400/rounded/school-fill.svg?raw";
import workFillSvg from "@material-symbols/svg-400/rounded/work-fill.svg?raw";
import groupsFillSvg from "@material-symbols/svg-400/rounded/groups-fill.svg?raw";
import psychologyFillSvg from "@material-symbols/svg-400/rounded/psychology-fill.svg?raw";
import rocketLaunchFillSvg from "@material-symbols/svg-400/rounded/rocket_launch-fill.svg?raw";
import volunteerActivismFillSvg from "@material-symbols/svg-400/rounded/volunteer_activism-fill.svg?raw";
import verifiedFillSvg from "@material-symbols/svg-400/rounded/verified-fill.svg?raw";
import militaryTechFillSvg from "@material-symbols/svg-400/rounded/military_tech-fill.svg?raw";
import menuBookFillSvg from "@material-symbols/svg-400/rounded/menu_book-fill.svg?raw";

const RAW = {
  badge: badgeSvg,
  school: schoolSvg,
  work: workSvg,
  groups: groupsSvg,
  psychology: psychologySvg,
  rocket_launch: rocketLaunchSvg,
  volunteer_activism: volunteerActivismSvg,
  verified: verifiedSvg,
  military_tech: militaryTechSvg,
  menu_book: menuBookSvg,
  visibility: visibilitySvg,
  visibility_off: visibilityOffSvg,
  more_horiz: moreHorizSvg,
  add: addSvg,
  delete: deleteSvg,
  arrow_upward: arrowUpwardSvg,
  arrow_downward: arrowDownwardSvg,
  content_copy: contentCopySvg,
  download: downloadSvg,
  settings: settingsSvg,
  keyboard_arrow_down: keyboardArrowDownSvg,
  close: closeSvg,
  description: descriptionSvg,
  upload_file: uploadFileSvg,
  shield_lock: shieldLockSvg,
  error: errorSvg,
  check: checkSvg,
  check_circle: checkCircleSvg,
  info: infoSvg,
  picture_as_pdf: pictureAsPdfSvg,
  menu: menuSvg,
  restart_alt: restartAltSvg,
  article: articleSvg,
} as const;

const RAW_FILLED: Partial<Record<IconName, string>> = {
  badge: badgeFillSvg,
  school: schoolFillSvg,
  work: workFillSvg,
  groups: groupsFillSvg,
  psychology: psychologyFillSvg,
  rocket_launch: rocketLaunchFillSvg,
  volunteer_activism: volunteerActivismFillSvg,
  verified: verifiedFillSvg,
  military_tech: militaryTechFillSvg,
  menu_book: menuBookFillSvg,
};

export type IconName = keyof typeof RAW;

const pathOf = (svg: string) => svg.match(/ d="([^"]+)"/)?.[1] ?? "";

interface IconProps {
  name: IconName;
  filled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/** A decorative icon; pair it with visible text or an aria-label on the control. */
export function Icon({ name, filled = false, size = "md", className = "" }: IconProps) {
  const raw = (filled && RAW_FILLED[name]) || RAW[name];
  return (
    <svg
      className={`cv-icon${size === "sm" ? " cv-icon--sm" : ""}${className ? ` ${className}` : ""}`}
      viewBox="0 -960 960 960"
      aria-hidden="true"
      focusable="false"
    >
      <path d={pathOf(raw)} />
    </svg>
  );
}
