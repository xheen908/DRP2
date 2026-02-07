cmake_minimum_required(VERSION 3.10)
project(TaxEngineCpp)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

# PAP Sources
set(PAP_SOURCES
    src/pap/Lohnsteuer2026_Core.cpp
    src/pap/Lohnsteuer2026_LSTLZZ.cpp
    src/pap/Lohnsteuer2026_SOLZLZZ.cpp
    src/pap/Lohnsteuer2026_SONSTB.cpp
    src/pap/Lohnsteuer2026_SV.cpp
)

add_executable(tax_engine src/main.cpp ${PAP_SOURCES})

# Link threads library (needed for httplib)
find_package(Threads REQUIRED)
target_link_libraries(tax_engine Threads::Threads)
