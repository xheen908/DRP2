cmake_minimum_required(VERSION 3.10)
project(tax-engine-cpp)

set(CMAKE_CXX_STANDARD 17)

# Include directories
include_directories(include)

# Compile all extracted PAP source files
set(PAP_SOURCES
    src/pap2026/berechnen.cpp
    src/pap2026/MPARA.cpp
    src/pap2026/MRE4JL.cpp
    src/pap2026/MRE4.cpp
    src/pap2026/MRE4ALTE.cpp
    src/pap2026/MRE4ABZ.cpp
    src/pap2026/MBERECH.cpp
    src/pap2026/UPVSP.cpp
    src/pap2026/UPMLST.cpp
    src/pap2026/UPTAB26.cpp
    src/pap2026/MST5_6.cpp
    src/pap2026/UP5_6.cpp
    src/pap2026/UPLSTLZZ.cpp
    src/pap2026/UPANTEIL.cpp
    src/pap2026/MSOLZ.cpp
    src/pap2026/MSOLZSTS.cpp
    src/pap2026/MSONST.cpp
    src/pap2026/berechneSV.cpp
)

# Main executable
add_executable(tax-engine src/main.cpp ${PAP_SOURCES})
