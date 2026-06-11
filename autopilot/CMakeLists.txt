cmake_minimum_required(VERSION 3.10)
project(Autopilot)
set(CMAKE_CXX_STANDARD 17)

file(GLOB_RECURSE AUTOPILOT_SOURCES CONFIGURE_DEPENDS
    ${CMAKE_SOURCE_DIR}/src/*.cpp
)

add_executable(autopilot ${AUTOPILOT_SOURCES})

target_include_directories(autopilot PRIVATE
    ${CMAKE_SOURCE_DIR}/include
)
