import React from 'react';
import { View } from 'react-native';

const MockedSvg = ({ children, ...props }) => <View {...props}>{children}</View>;
const MockedRect = props => <View {...props} />;
const MockedPath = props => <View {...props} />;
const MockedText = props => <View {...props} />;
const MockedG = ({ children, ...props }) => <View {...props}>{children}</View>;
const MockedCircle = props => <View {...props} />;
const MockedPolygon = props => <View {...props} />;
const MockedPattern = ({ children, ...props }) => <View {...props}>{children}</View>;
const MockedLine = props => <View {...props} />;
const MockedDefs = ({ children, ...props }) => <View {...props}>{children}</View>;
const MockedLinearGradient = ({ children, ...props }) => <View {...props}>{children}</View>;
const MockedStop = props => <View {...props} />;

export default MockedSvg;
export const Svg = MockedSvg;
export const Rect = MockedRect;
export const Path = MockedPath;
export const Text = MockedText;
export const G = MockedG;
export const Circle = MockedCircle;
export const Polygon = MockedPolygon;
export const Pattern = MockedPattern;
export const Line = MockedLine;
export const Defs = MockedDefs;
export const LinearGradient = MockedLinearGradient;
export const Stop = MockedStop;